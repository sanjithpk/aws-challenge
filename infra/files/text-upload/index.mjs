import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { customAlphabet } from "nanoid";
const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 21);

const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event) => {
  const { input_text, input_file_path } = event;
  const id = nanoid();

  const params = {
    TableName: "TextTable",
    Item: {
      id,
      input_text,
      input_file_path,
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({ id }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to insert data into DynamoDB" }),
    };
  }
};
