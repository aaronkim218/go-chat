package handlers

import (
	"fmt"
	"net/http"

	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/xcontext"
	"go-chat/internal/xerrors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (hs *HandlerService) GetProfileByUserId(c *fiber.Ctx) error {
	userId, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	profile, err := hs.storage.GetProfileByUserId(c.Context(), userId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profile)
}

func (hs *HandlerService) GetForeignProfileByUserId(c *fiber.Ctx) error {
	profileId := c.Params("profileId")

	if profileId == "" {
		return xerrors.BadRequestError("profile id is required")
	}

	uuidProfileId, err := uuid.Parse(profileId)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid room id: %s", profileId))
	}

	profile, err := hs.storage.GetProfileByUserId(c.Context(), uuidProfileId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profile)
}

func (hs *HandlerService) PatchProfileByUserId(c *fiber.Ctx) error {
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

	if err := hs.storage.PatchProfileByUserId(
		c.Context(),
		partialProfile,
		userId,
	); err != nil {
		return err
	}

	return c.SendStatus(http.StatusNoContent)
}

func (hs *HandlerService) CreateProfile(c *fiber.Ctx) error {
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

	if err := hs.storage.CreateProfile(
		c.Context(),
		profile,
	); err != nil {
		return err
	}

	return c.SendStatus(http.StatusCreated)
}

func (hs *HandlerService) SearchProfiles(c *fiber.Ctx) error {
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

	profiles, err := hs.storage.SearchProfiles(c.Context(), options, userId)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profiles)
}
