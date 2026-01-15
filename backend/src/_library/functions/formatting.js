export const extract_file_name_and_type = (f) => {
    const file_name = f.filename.split('.')[0].replace(" ", "_").upper();
    const file_type = f.filename.split('.')[1];
    return [file_name, file_type];
}