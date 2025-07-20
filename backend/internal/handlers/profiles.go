package handlers

import (
	"fmt"
	"net/http"
	"time"

	"go-chat/internal/models"
	"go-chat/internal/types"
	"go-chat/internal/xcontext"
	"go-chat/internal/xerrors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (hs *HandlerService) GetProfileByUserId(c *fiber.Ctx) error {
	uid, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	profile, err := hs.storage.GetProfileByUserId(c.Context(), uid)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profile)
}

func (hs *HandlerService) GetForeignProfileByUserId(c *fiber.Ctx) error {
	pidStr := c.Params("profileId")

	if pidStr == "" {
		return xerrors.BadRequestError("profile id is required")
	}

	pid, err := uuid.Parse(pidStr)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid room id: %s", pidStr))
	}

	profile, err := hs.storage.GetProfileByUserId(c.Context(), pid)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profile)
}

func (hs *HandlerService) PatchProfileByUserId(c *fiber.Ctx) error {
	uid, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	var partial types.PartialProfile
	if err := c.BodyParser(&partial); err != nil {
		return xerrors.InvalidJSON()
	}

	if errMap := partial.Validate(); len(errMap) > 0 {
		return xerrors.UnprocessableEntityError(errMap)
	}

	partial.UpdatedAt = time.Now()

	if err := hs.storage.PatchProfileByUserId(c.Context(), partial, uid); err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(partial)
}

func (hs *HandlerService) CreateProfile(c *fiber.Ctx) error {
	uid, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	var profile models.Profile
	if err := c.BodyParser(&profile); err != nil {
		return xerrors.InvalidJSON()
	}

	if errMap := profile.Validate(); len(errMap) > 0 {
		return xerrors.UnprocessableEntityError(errMap)
	}

	profile.UserId = uid
	profile.CreatedAt = time.Now()
	profile.UpdatedAt = time.Now()

	if err := hs.storage.CreateProfile(c.Context(), profile); err != nil {
		return err
	}

	return c.Status(http.StatusCreated).JSON(profile)
}

func (hs *HandlerService) SearchProfiles(c *fiber.Ctx) error {
	uid, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	var opts types.SearchProfilesOptions
	if err := c.QueryParser(&opts); err != nil {
		return xerrors.BadRequestError("failed to parse query parameters")
	}

	if errMap := opts.Validate(); len(errMap) > 0 {
		return xerrors.UnprocessableEntityError(errMap)
	}

	profiles, err := hs.storage.SearchProfiles(c.Context(), opts, uid)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(profiles)
}
