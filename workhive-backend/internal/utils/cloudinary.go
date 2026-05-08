package utils

import (
	"context"
	"mime/multipart"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func UploadToCloudinary(file multipart.File, cloudinaryURL string) (string, error) {
	cld, err := cloudinary.NewFromURL(cloudinaryURL)
	if err != nil {
		return "", err
	}

	uploadResult, err := cld.Upload.Upload(context.Background(), file, uploader.UploadParams{
		Folder: "uploads",
	})
	if err != nil {
		return "", err
	}

	return uploadResult.SecureURL, nil
}

func DeleteFromCloudinary(publicID string, cloudinaryURL string) error {
	cld, err := cloudinary.NewFromURL(cloudinaryURL)
	if err != nil {
		return err
	}

	_, err = cld.Upload.Destroy(context.Background(), uploader.DestroyParams{
		PublicID: publicID,
	})
	return err
}