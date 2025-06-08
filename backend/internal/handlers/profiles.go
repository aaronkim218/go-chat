package handlers

import (
	"fmt"
	"go-chat/internal/constants"
	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/xcontext"
	"go-chat/internal/xerrors"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

func (s *Service) GetProfileByUserId(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	profile, err := s.storage.GetProfileByUserId(c.Context(), userId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profile)
}

func (s *Service) PatchProfileByUserId(c *fiber.Ctx) error {
	type request struct {
		Username *string `json:"username"`
	}

	validate := func(req request) map[string]string {
		var errMap = make(map[string]string)

		if req.Username != nil && (len(*req.Username) < constants.MinUsernameLength || len(*req.Username) > constants.MaxUsernameLength) {
			errMap["username"] = fmt.Sprintf(
				"username length must be between %d and %d",
				constants.MinUsernameLength,
				constants.MaxUsernameLength,
			)
		}

		return errMap
	}

	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	var req request
	if err := c.BodyParser(&req); err != nil {
		return xerrors.InvalidJSON()
	}

	if errMap := validate(req); len(errMap) > 0 {
		return xerrors.UnprocessableEntityError(errMap)
	}

	if err := s.storage.PatchProfileByUserId(
		c.Context(),
		models.Profile{
			Username: *req.Username,
		},
		userId,
	); err != nil {
		return err
	}

	return c.SendStatus(http.StatusNoContent)
}

func (s *Service) CreateProfile(c *fiber.Ctx) error {
	type request struct {
		Username string `json:"username"`
	}

	validate := func(req request) map[string]string {
		var errMap = make(map[string]string)

		if len(req.Username) < constants.MinUsernameLength || len(req.Username) > constants.MaxUsernameLength {
			errMap["username"] = fmt.Sprintf(
				"username length must be between %d and %d",
				constants.MinUsernameLength,
				constants.MaxUsernameLength,
			)
		}

		return errMap
	}

	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	var req request
	if err := c.BodyParser(&req); err != nil {
		return xerrors.InvalidJSON()
	}

	if errMap := validate(req); len(errMap) > 0 {
		return xerrors.UnprocessableEntityError(errMap)
	}

	if err := s.storage.CreateProfile(
		c.Context(),
		models.Profile{
			UserId:   userId,
			Username: req.Username,
		},
	); err != nil {
		return err
	}

	return c.SendStatus(http.StatusCreated)
}

func (s *Service) SearchProfiles(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	var options types.SearchProfilesOptions
	if err := c.QueryParser(&options); err != nil {
		return xerrors.BadRequestError("missing query parameters")
	}

	if errMap := options.Validate(); len(errMap) > 0 {
		return xerrors.UnprocessableEntityError(errMap)
	}

	profiles, err := s.storage.SearchProfiles(c.Context(), options, userId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profiles)
}
