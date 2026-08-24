package storage

import (
	"errors"
	"mime/multipart"
)

type DisabledStorage struct {
	err error
}

func NewDisabledStorage(err error) *DisabledStorage {
	if err == nil {
		err = errors.New("image storage is not configured")
	}
	return &DisabledStorage{err: err}
}

func (s *DisabledStorage) Upload(_ *multipart.FileHeader) (string, error) {
	return "", s.err
}
