import { useState } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function App() {
  const [textInput, setTextInput] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("No file chosen");
  const [feedback, setFeedback] = useState({ message: "", color: "green" });
  const bucketName = import.meta.env.VITE_S3_BUCKET!;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setFileInput(file);
    setFileName(file ? file.name : "No file chosen");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fileInput) {
      const s3 = new S3Client({
        region: import.meta.env.VITE_AWS_REGION,
        credentials: {
          accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
          secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
        },
      });

      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileInput,
      });

      const body = {
        input_text: textInput,
        input_file_path: `https://${bucketName}.s3.amazonaws.com/${fileName}`,
      };

      try {
        await s3.send(putObjectCommand);
        console.log(`File uploaded: ${bucketName}/${fileName}`);
        let response = await fetch(import.meta.env.VITE_INVOKE_URL, {
          method: "POST",
          body: JSON.stringify(body),
        });
        response = await response.json();
        if (response.status === 200) {
          setFeedback({
            message: "File uploaded successfully!",
            color: "green",
          });
        } else {
          setFeedback({ message: "Error uploading file.", color: "red" });
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }

      setTimeout(() => setFeedback({ message: "", color: "green" }), 1000);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center h-screen bg-gray-50">
        {feedback.message && (
          <div
            className={`absolute top-20 text-white px-4 py-2 rounded-md ${
              feedback.color === "green" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {feedback.message}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-white shadow-lg rounded-lg"
        >
          <div>
            <label
              htmlFor="textInput"
              className="block text-sm font-medium text-gray-700"
            >
              Text Input
            </label>
            <input
              type="text"
              id="textInput"
              value={textInput}
              required
              onChange={(e) => setTextInput(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="w-full mt-4">
            <label
              htmlFor="fileInput"
              className="block text-sm font-medium text-gray-700"
            >
              File Input
            </label>
            <div className="mt-1 flex items-center w-full">
              <div className="relative flex items-center justify-center cursor-pointer flex-grow-0 flex-shrink-0">
                <button
                  type="button"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-l-md focus:outline-none"
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  Choose File
                </button>
                <input
                  type="file"
                  id="fileInput"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white text-gray-600 text-sm flex-grow flex-shrink min-w-0">
                {fileName}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex justify-center mt-6 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
