import { useState } from "react";

function App() {
  const [textInput, setTextInput] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("No file chosen");
  // const bucketName = "fovus-txt-store";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setFileInput(file);
    setFileName(file ? file.name : "No file chosen");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Text Input:", textInput);
    if (fileInput) {
      console.log(fileInput.name);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center h-screen bg-gray-50">
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
            <div className="mt-1 flex justify-center items-center">
              <div className="relative flex items-center justify-center cursor-pointer">
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
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0"
                />
              </div>
              <div className="flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white text-gray-600 text-sm">
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
