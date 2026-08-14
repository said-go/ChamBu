package storage

import (
	"context"
	"mime/multipart"
	"strings"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryStorage struct {
	client *cloudinary.Cloudinary
}

func NewCloudinaryStorage(
	cloudName string,
	apiKey string,
	apiSecret string,
) (*CloudinaryStorage, error) {

	cld, err := cloudinary.NewFromParams(
		cloudName,
		apiKey,
		apiSecret,
	)

	if err != nil {
		return nil, err
	}

	return &CloudinaryStorage{
		client: cld,
	}, nil
}

func (s *CloudinaryStorage) Upload(
	file *multipart.FileHeader,
) (string, error) {
	overwrite := true
	useFilename := true
	uniqueFilename := false

	image, err := CompressImage(file)

	if err != nil {
		return "", err
	}

	result, err := s.client.Upload.Upload(
		context.Background(),
		image,
		uploader.UploadParams{
			Folder:         "chambu-menu",
			ResourceType:   "image",
			PublicID:       strings.TrimSuffix(file.Filename, ".jpg"),
			Overwrite:      &overwrite,
			UseFilename:    &useFilename,
			UniqueFilename: &uniqueFilename,
		},
	)

	if err != nil {
		return "", err
	}

	return result.SecureURL, nil
}
