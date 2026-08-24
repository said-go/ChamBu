package transport

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"chambu/server/internal/models"
	"chambu/server/internal/service"
)

type OrderHandler struct {
	service service.OrderService
}

func NewOrderHandler(s service.OrderService) *OrderHandler {
	return &OrderHandler{service: s}
}

func (h *OrderHandler) OrderRegisterRoutes(authorized *gin.RouterGroup, unauthorized *gin.RouterGroup) {

	publicOrders := unauthorized.Group("/orders")
	{
		publicOrders.POST("", h.Create)
	}

	protectedOrders := authorized.Group("/orders")
	{
		protectedOrders.GET("", h.List)
		protectedOrders.GET("/:id", h.Get)
		protectedOrders.DELETE("/:id", h.Delete)
	}
}

func (h *OrderHandler) Create(c *gin.Context) {
	var req models.OrderCreate

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": err.Error(),
		})
		return
	}

	order, err := h.service.Create(&req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidOrder) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal server error",
		})
		return
	}

	c.JSON(http.StatusCreated, order)
}

func (h *OrderHandler) List(c *gin.Context) {

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	orders, total, err := h.service.List(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"page":   page,
		"limit":  limit,
		"total":  total,
	})
}

func (h *OrderHandler) Get(c *gin.Context) {

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid id",
		})
		return
	}

	order, err := h.service.Get(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if order == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "order not found",
		})
		return
	}

	c.JSON(http.StatusOK, order)
}

func (h *OrderHandler) Delete(c *gin.Context) {

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid id",
		})
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "deleted successfully",
	})
}
