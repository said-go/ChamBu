package storage

import (
	"fmt"
	"mime/multipart"
)

type YandexStorage struct {
	Token string
}

func NewYandexStorage(token string) *YandexStorage {

	return &YandexStorage{
		Token: token,
	}
}

func (s *YandexStorage) Upload(file *multipart.FileHeader) (string, error) {

	image, err := CompressImage(file)

	if err != nil {
		return "", err
	}

	fmt.Println(
		"compressed image size:",
		image.Len(),
	)

	filename := file.Filename

	url := fmt.Sprintf(
		"https://yandex.disk/%s",
		filename,
	)

	return url, nil
}
