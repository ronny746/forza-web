export const BASE_STATIC_URL = "https://wsn3.workgateway.in"; // fixed base URL

export const downloadTemplate = async (file_type) => {
    let filePath;
    let fileName;

    if (file_type === "visit") {
        filePath = `${BASE_STATIC_URL}/template_file/VisitTemplate1.xlsx`;
        fileName = "VisitTemplate1.xlsx";
    } else {
        filePath = `${BASE_STATIC_URL}/template_file/UserTemplate.xlsx`;
        fileName = "UserTemplate.xlsx";
    }

    const link = document.createElement("a");
    link.href = filePath;
    link.setAttribute("download", fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const downloadImage = async (showImg) => {
    const filePath = `${BASE_STATIC_URL}/application_img/${showImg}`;

    const link = document.createElement("a");
    link.href = filePath;
    link.setAttribute("download", showImg);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
