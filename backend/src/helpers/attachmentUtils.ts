import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpirationTime = process.env.SIGNED_URL_EXPIRATION_TIME || 300

export const createAttachmentPreSignedUrl = (todoId: string) => {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: `${todoId}.png`,
    Expires: urlExpirationTime
  })
}

export const getTodoAttachmentUrl = async (todoId: string): Promise<string> => {
  try {
    await s3.headObject({
      Bucket: bucketName,
      Key: `${todoId}.png`
    }).promise()

    return s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: `${todoId}.png`,
      Expires: urlExpirationTime
    })
  } catch (err) {
    console.log(err)
  }
}
