package transport

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"chambu/server/internal/models"
	"chambu/server/internal/service"

	"github.com/gin-gonic/gin"
)

type MenuHandler struct {
	service service.MenuService
}

func NewMenuHandler(service service.MenuService) *MenuHandler {
	return &MenuHandler{service: service}
}

func (h *MenuHandler) RegisterRoutes(authorized *gin.RouterGroup, unauthorized *gin.RouterGroup) {
	publicMenu := unauthorized.Group("/api/menu")
	{
		publicMenu.GET("", h.Catalog)
		publicMenu.GET("/items", h.GetAll)
		publicMenu.GET("/items/:id", h.GetByID)
	}

	protectedItems := authorized.Group("/api/admin/items")
	{
		protectedItems.POST("", h.Create)
		protectedItems.PUT("/:id", h.Update)
		protectedItems.DELETE("/:id", h.Delete)
	}

}

func (h *MenuHandler) Catalog(c *gin.Context) {
	catalog, err := h.service.Catalog()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, catalog)
}

func (h *MenuHandler) GetAll(c *gin.Context) {
	filter := models.MenuFilter{
		Category: c.Query("category"),
		Search:   c.Query("search"),
	}

	page := positiveInt(c.DefaultQuery("page", "1"), 1)
	limit := positiveInt(c.DefaultQuery("limit", "20"), 20)
	if limit > 100 {
		limit = 100
	}

	items, total, err := h.service.GetAll(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func (h *MenuHandler) Create(c *gin.Context) {
	req, err := menuItemCreateFromRequest(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	imageURL := ""
	file, err := c.FormFile("imageFile")
	if err == nil {
		imageURL, err = h.service.UploadImage(file)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	item, err := h.service.Create(req, imageURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *MenuHandler) GetByID(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("id"))
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	item, err := h.service.GetBySlug(slug)
	if err != nil {
		if errors.Is(err, service.ErrMenuItemNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "menu item not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"item": item})
}

func (h *MenuHandler) Update(c *gin.Context) {
	id, ok := uintParam(c, "id")
	if !ok {
		return
	}

	var input models.MenuItemUpdate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	item, err := h.service.Update(id, &input)
	if err != nil {
		if errors.Is(err, service.ErrMenuItemNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "menu item not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *MenuHandler) Delete(c *gin.Context) {
	if err := h.service.Delete(c.Param("id")); err != nil {
		if errors.Is(err, service.ErrMenuItemNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "menu item not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *MenuHandler) SaveCategory(c *gin.Context) {
	var input models.MenuCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	category, err := h.service.SaveCategory(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, category)
}

func (h *MenuHandler) DeleteCategory(c *gin.Context) {
	if err := h.service.DeleteCategory(c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func menuItemCreateFromRequest(c *gin.Context) (*models.MenuItemCreate, error) {
	if strings.HasPrefix(c.GetHeader("Content-Type"), "application/json") {
		var req models.MenuItemCreate
		if err := c.ShouldBindJSON(&req); err != nil {
			return nil, err
		}
		return &req, nil
	}

	price, err := strconv.ParseInt(c.PostForm("price"), 10, 64)
	if err != nil {
		return nil, errors.New("invalid price")
	}

	var badges []string
	rawBadges := c.PostForm("badges")
	if strings.HasPrefix(strings.TrimSpace(rawBadges), "[") {
		if err := json.Unmarshal([]byte(rawBadges), &badges); err != nil {
			return nil, errors.New("invalid badges")
		}
	} else if rawBadges != "" {
		for _, badge := range strings.Split(rawBadges, ",") {
			if trimmed := strings.TrimSpace(badge); trimmed != "" {
				badges = append(badges, trimmed)
			}
		}
	}

	available := true
	if raw := c.PostForm("available"); raw != "" {
		parsed, err := parseBoolForm(raw)
		if err != nil {
			return nil, errors.New("invalid available")
		}
		available = parsed
	}

	return &models.MenuItemCreate{
		ID:          c.PostForm("id"),
		CategoryID:  c.PostForm("categoryId"),
		Name:        c.PostForm("name"),
		Description: c.PostForm("description"),
		Price:       price,
		Weight:      c.PostForm("weight"),
		Badges:      badges,
		Image:       c.PostForm("image"),
		Available:   &available,
	}, nil
}

func parseBoolForm(value string) (bool, error) {
	if value == "on" {
		return true, nil
	}
	return strconv.ParseBool(value)
}

func uintParam(c *gin.Context, name string) (uint, bool) {
	id, err := strconv.ParseUint(c.Param(name), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return 0, false
	}
	return uint(id), true
}

func positiveInt(value string, fallback int) int {
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed < 1 {
		return fallback
	}
	return parsed
}
