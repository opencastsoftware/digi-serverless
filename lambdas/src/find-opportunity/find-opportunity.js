import AWS from 'aws-sdk';
import { parseZone } from 'moment';
import findOpportunitiesOnPage from './helpers/find-opportunities-on-page';


AWS.config.update({ region: "eu-west-2" });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

const base_url =
  "https://www.digitalmarketplace.service.gov.uk/digital-outcomes-and-specialists/opportunities";

export function convertDataToMessage(data) {
  return {
    DelaySeconds: 10,
    MessageAttributes: {
      Title: {
        DataType: "String",
        StringValue: data.title,
      },
      Link: {
        DataType: "String",
        StringValue: data.link,
      },
      Organisation: {
        DataType: "String",
        StringValue: data.organisation,
      },
      Location: {
        DataType: "String",
        StringValue: data.location,
      },
      Type: {
        DataType: "String",
        StringValue: data.type,
      },
      ID: {
        DataType: "Number",
        StringValue: data.id.toString(),
      },
      PublishedDate: {
        DataType: "Number",
        StringValue: data.publishedDate.toString(),
      },
      QuestionsDeadlineDate: {
        DataType: "Number",
        StringValue: data.questionsDeadlineDate.toString(),
      },
      ClosingDate: {
        DataType: "Number",
        StringValue: data.closingDate.toString(),
      },
    },
    MessageBody: data.title,
    QueueUrl: process.env.SQS_QUEUE_URL.toString(),
  };
}

export default async function handler(event) {
  const yesterday = Date.now() - 86400000 * 3;
  const opps = await findOpportunitiesOnPage(base_url, yesterday);
  console.log("OPPS: " + opps.length);
  const promises = opps.map((opp) => {
    const message = convertDataToMessage(opp);
    // console.log(message);
    return sqs.sendMessage(message).promise();
  });
  
  
  console.log("Promises: " + promises.length);
  await Promise.allSettled(promises).then((results) =>
    results.forEach((result) => console.log("RES", result))
  );
  console.log("FINISHED");
  const response = {
    statusCode: 201,
    body: JSON.stringify("Finding the new opportunities!"),
  };
  return response;
};

