// Assuming AWS SDK v3 is installed
// npm install @aws-sdk/client-ec2 @aws-sdk/client-s3

import { RunInstancesCommand } from "@aws-sdk/client-ec2";
import { EC2Client } from "@aws-sdk/client-ec2";

export const handler = async (event) => {
  let { eventName } = event.Records[0];
  console.log(eventName);
  if (eventName != "INSERT") return;

  let { id } = event.Records[0].dynamodb.NewImage;
  id = id.S;

  const ec2Client = new EC2Client({ region: "us-east-1" }); // Specify the correct region

  const userDataScript = `#!/bin/bash
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
export TOKEN
EC2_INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
export EC2_INSTANCE_ID
aws s3 cp s3://fovus-text-store/script.py /home/ec2-user/script.py
chmod +x /home/ec2-user/script.py
sudo yum -y install python-pip
pip install boto3
export RECORD_ID=${id} 
/usr/bin/python3 /home/ec2-user/script.py > /home/ec2-user/script.log
`;

  const runInstancesCommand = new RunInstancesCommand({
    ImageId: "ami-051f8a213df8bc089",
    InstanceType: "t2.micro",
    MinCount: 1,
    MaxCount: 1,
    KeyName: "my_key_pair",
    SecurityGroupIds: ["sg-0459c2e511fd3a909"],
    UserData: Buffer.from(userDataScript).toString("base64"),
    IamInstanceProfile: {
      Name: "text-ec2",
    },
  });

  try {
    const data = await ec2Client.send(runInstancesCommand);
    console.log("Success", data.Instances[0].InstanceId);
    return {
      statusCode: 200,
      body: JSON.stringify(
        "EC2 instance created and script execution started."
      ),
    };
  } catch (err) {
    console.error("Failed to create EC2 instance", err);
    return {
      statusCode: 500,
      body: JSON.stringify("Failed to create EC2 instance."),
    };
  }
};
