package transport

import (
	"errors"
	"net/http"
	"strconv"

	"chambu/server/internal/models"
	"chambu/server/internal/repository"
	"chambu/server/internal/service"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	service service.AdminService
}

func NewAdminHandler(service service.AdminService) *AdminHandler {
	return &AdminHandler{
		service: service,
	}
}

func (h *AdminHandler) AdminRegisterRoutes(authorized *gin.RouterGroup, unauthorized *gin.RouterGroup) {

	adminRoutes := authorized.Group("/admins")
	{
		adminRoutes.POST("", h.Create)
		adminRoutes.GET("", h.List)
		adminRoutes.GET("/:id", h.Get)
	}

}

// POST /admins
func (h *AdminHandler) Create(c *gin.Context) {

	var input models.AdminCreate

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	admin, err := h.service.Create(&input)

	if err != nil {

		if errors.Is(err, service.ErrAdminAlreadyExists) {
			c.JSON(http.StatusConflict, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal server error",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"admin": admin,
	})
}

// GET /admins/:id
func (h *AdminHandler) Get(c *gin.Context) {

	idParam := c.Param("id")

	id, err := strconv.ParseUint(idParam, 10, 64)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid id",
		})
		return
	}

	admin, err := h.service.Get(uint(id))

	if err != nil {

		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "admin not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal server error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"admin": admin,
	})
}

// GET /admins?limit=10&offset=0
func (h *AdminHandler) List(c *gin.Context) {

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid limit",
		})
		return
	}

	offset, err := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid offset",
		})
		return
	}

	admins, err := h.service.List(limit, offset)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal server error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"admins": admins,
	})
}
