import boto3
import os

# Initialize Boto3 clients
s3_client = boto3.client('s3', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
ec2_client = boto3.client('ec2', region_name='us-east-1')

# DynamoDB and S3 settings
table_name = 'TextTable'
bucket_name = 'fovus-text-store'

instance_id = os.environ.get('EC2_INSTANCE_ID')
record_id = os.environ.get('RECORD_ID')

# Fetch the item from DynamoDB
table = dynamodb.Table(table_name)
response = table.get_item(Key={'id': record_id})
item = response.get('Item', {})
input_text = item.get('input_text', '')
input_file_path = item.get('input_file_path', '')  # S3 key of the input file

# Extract the file name from the input_file_path
input_file_name = input_file_path.split('/')[-1]

# Download the file from S3
local_input_file_path = f'/tmp/{input_file_name}'
s3_client.download_file(bucket_name, input_file_name, local_input_file_path)

# Append the text from DynamoDB to the input file content
with open(local_input_file_path, 'a') as file:
    file.write(f"\n{input_text}")

# Prepare the output file name and local path
output_file_name = f'{record_id}_output.txt'
local_output_file_path = f'/tmp/{output_file_name}'

# Save the new file with appended content
os.rename(local_input_file_path, local_output_file_path)

# Upload the output file to the output S3 bucket
s3_client.upload_file(local_output_file_path, bucket_name, output_file_name)

# Update the DynamoDB record with the new output file's S3 path
table.update_item(
    Key={'id': record_id},
    UpdateExpression='SET output_file_path = :val1',
    ExpressionAttributeValues={
        ':val1': f's3://{bucket_name}/{output_file_name}'
    }
)

# Optionally, clean up the temporary files if needed
os.remove(local_output_file_path)

print(f"Processed file {output_file_name} successfully.")

if instance_id:
    print(f"Terminating EC2 instance: {instance_id}")
    ec2_client.terminate_instances(InstanceIds=[instance_id])
    print(f"Termination signal sent for EC2 instance: {instance_id}")
else:
    print("EC2 instance ID not provided. Skipping termination.")