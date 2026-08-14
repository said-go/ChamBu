package response

import "github.com/gin-gonic/gin"

func Success(c *gin.Context, data any, meta any) {
	if meta != nil {
		c.JSON(200, gin.H{
			"data": data,
			"meta": meta,
		})
		return
	}

	c.JSON(200, gin.H{
		"data": data,
	})
}

func Created(c *gin.Context, data any) {
	c.JSON(201, gin.H{
		"data": data,
	})
}

func Error(c *gin.Context, code int, msg string) {
	c.JSON(code, gin.H{
		"error": msg,
	})
}
