const deleteExistingImage = async (image) => {
  return await fs.unlink(image);
};
export default deleteExistingImage;
