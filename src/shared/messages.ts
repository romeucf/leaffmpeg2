export type ConvertRequest = {
    type: 'CONVERT';
    fileName: string;
    outputFormat: string;
    fileData: ArrayBuffer;
};

export type ProgressResponse = {
    type: 'PROGRESS';
    progress: number;
    message: string;
}

export type SuccessResponse = {
    type: 'SUCCESS';
    fileOutput: ArrayBuffer;
    newName: string;
}

export type ErrorResponse = {
    type: 'ERROR';
    errorMessage: string;
}

export type ConvertResponse = ProgressResponse | SuccessResponse | ErrorResponse;