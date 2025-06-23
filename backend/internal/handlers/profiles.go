package handlers

import (
	"net/http"

	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/xcontext"
	"go-chat/internal/xerrors"

	"github.com/gofiber/fiber/v2"
)

func (s *HandlerService) GetProfileByUserId(c *fiber.Ctx) error {
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

func (s *HandlerService) PatchProfileByUserId(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	var partialProfile types.PartialProfile
	if err := c.BodyParser(&partialProfile); err != nil {
		return xerrors.InvalidJSON()
	}

	if errMap := partialProfile.Validate(); len(errMap) > 0 {
		return xerrors.UnprocessableEntityError(errMap)
	}

	if err := s.storage.PatchProfileByUserId(
		c.Context(),
		partialProfile,
		userId,
	); err != nil {
		return err
	}

	return c.SendStatus(http.StatusNoContent)
}

func (s *HandlerService) CreateProfile(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	var profile models.Profile
	if err := c.BodyParser(&profile); err != nil {
		return xerrors.InvalidJSON()
	}

	profile.UserId = userId

	if errMap := profile.Validate(); len(errMap) > 0 {
		return xerrors.UnprocessableEntityError(errMap)
	}

	if err := s.storage.CreateProfile(
		c.Context(),
		profile,
	); err != nil {
		return err
	}

	return c.SendStatus(http.StatusCreated)
}

func (s *HandlerService) SearchProfiles(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	var options types.SearchProfilesOptions
	if err := c.QueryParser(&options); err != nil {
		return xerrors.BadRequestError("failed to parse query parameters")
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
