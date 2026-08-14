package transport

import (
	"chambu/server/internal/service"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(
	router *gin.Engine,
	menuService service.MenuService,
	orderService service.OrderService,
	adminService service.AdminService,
	authService *service.AuthService,
) {

	authorized := router.Group("")
	authorized.Use(AdminTokenOrJWTMiddleware())

	unauthorized := router.Group("")

	menuHandler := NewMenuHandler(menuService)
	orderHandler := NewOrderHandler(orderService)
	adminHandler := NewAdminHandler(adminService)
	authHandler := NewAuthHandler(authService)

	unauthorized.POST("/auth/login", authHandler.Login)
	unauthorized.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	menuHandler.RegisterRoutes(authorized, unauthorized)
	orderHandler.OrderRegisterRoutes(authorized, unauthorized)
	adminHandler.AdminRegisterRoutes(authorized, unauthorized)
}
