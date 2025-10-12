import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

async def upload_image_to_cloudinary(file: UploadFile) -> str:
    """Upload image to Cloudinary and return URL"""
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload to cloudinary
        result = cloudinary.uploader.upload(
            file_content,
            folder="ruraliq_reports",
            resource_type="image"
        )
        
        return result["secure_url"]
    except Exception as e:
        print(f"Error uploading to Cloudinary: {e}")
        return None