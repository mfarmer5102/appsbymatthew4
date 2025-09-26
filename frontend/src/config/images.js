// Configuration for application images
export const APPLICATION_IMAGE_BASE_URL = 'https://mfarmer5102-public.s3.us-east-1.amazonaws.com/application_data/apps_by_matthew/application_thumbnails/';

// Helper function to get full image URL
export const getApplicationImageUrl = (relativeUrl) => {
  if (!relativeUrl) {
    return 'https://via.placeholder.com/300x200?text=No+Image';
  }
  
  // If the URL is already absolute, return as is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  
  // Otherwise, prepend the base URL
  return `${APPLICATION_IMAGE_BASE_URL}${relativeUrl}`;
};
