package storage

import (
	"bytes"
	"image"
	"image/jpeg"
	"mime/multipart"

	"github.com/nfnt/resize"
)

func CompressImage(file *multipart.FileHeader) (*bytes.Buffer, error) {

	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()
	img, _, err := image.Decode(src)

	if err != nil {
		return nil, err
	}

	resized := resize.Resize(
		800,
		0,
		img,
		resize.Lanczos3,
	)
	buffer := new(bytes.Buffer)

	err = jpeg.Encode(
		buffer,
		resized,
		&jpeg.Options{
			Quality: 80,
		},
	)

	if err != nil {
		return nil, err
	}
	return buffer, nil
}
