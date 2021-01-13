const osmosis = require("osmosis");
const AWS = require("aws-sdk");
AWS.config.update({ region: "eu-west-2" });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
AWS.config.logger = console;

const base_url =
  "https://www.digitalmarketplace.service.gov.uk/digital-outcomes-and-specialists/opportunities";




//findAllOpportunities().then((opportunity) => console.log(opportunity));

function totalNumberOfPages() {
  return new Promise((resolve) => {
    let total;
    osmosis
      .get(base_url)
      .find('//*[@id="js-dm-live-search-results"]/nav/ul/li/a/span[3]')
      .set("total")
      .data((x) => {
        total = parseInt(x.total.match(/\d+ of (\d+)/).pop());
      })
      .done(() => resolve(total));
  });
}

function convertDataToMessage(data) {
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

const handler = async (event) => {
  const yesterday = Date.now() - 86400000 * 3;
  const opps = await findOpportunitiesOnPage(base_url, yesterday);
  console.log("OPPS: " + opps.length);
  const promises = opps.map(async (opp) => {
    const message = convertDataToMessage(opp);
    console.log(message);
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

//handler({});

module.exports = {
  findOpportunitiesOnPage,
  findAllOpportunities,
  totalNumberOfPages,
  convertDataToMessage,
  handler,
  sqs,
};
