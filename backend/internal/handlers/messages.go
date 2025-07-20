package handlers

import (
	"fmt"
	"net/http"

	"go-chat/internal/xcontext"
	"go-chat/internal/xerrors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (hs *HandlerService) DeleteMessageById(c *fiber.Ctx) error {
	uid, err := xcontext.GetUserId(c)
	if err != nil {
		return err
	}

	midStr := c.Params("messageId")

	mid, err := uuid.Parse(midStr)
	if err != nil {
		return xerrors.BadRequestError(fmt.Sprintf("invalid user id: %s", midStr))
	}

	if err := hs.storage.DeleteMessageById(c.Context(), mid, uid); err != nil {
		return err
	}

	return c.SendStatus(http.StatusNoContent)
}
