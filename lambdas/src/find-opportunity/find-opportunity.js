const osmosis = require("osmosis");
const AWS = require("aws-sdk");
AWS.config.update({ region: "eu-west-2" });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
AWS.config.logger = console;

const base_url =
  "https://www.digitalmarketplace.service.gov.uk/digital-outcomes-and-specialists/opportunities";

function findOpportunitiesOnPage(url, dateFrom) {
  console.log(
    "finding opportunities [url: " + url + " dateFrom: " + dateFrom + "]"
  );
  return new Promise((resolve) => {
    const opportunities = [];
    osmosis
      .get(url)
      .find('//*[@id="js-dm-live-search-results"]/ul/li')
      .set({
        title: "h2/a",
        link: "h2/a@href",
        organisation: "ul[1]/li[1]/text()[normalize-space()]",
        location: "ul[1]/li[2]/text()[normalize-space()]",
        type: "ul[2]/li[1]",
        publishedDate: "ul[3]/li[1]",
        questionsDeadlineDate: "ul[3]/li[2]",
        closingDate: "ul[3]/li[3]",
      })
      .data((x) => {
        if (x.publishedDate.startsWith("Closed")) {
          x.publishedDate = 0;
          x.closingDate = 0;
          x.questionsDeadlineDate = 0;
        } else {
          x.publishedDate = Date.parse(x.publishedDate.match(/\d+ \w+ \d+/));
          x.questionsDeadlineDate = Date.parse(
            x.questionsDeadlineDate.match(/\d+ \w+ \d+/)
          );
          x.closingDate = Date.parse(x.closingDate.match(/\d+ \w+ \d+/));
        }
        x.id = parseInt(x.link.match(/\d+/).pop());
        if (x.publishedDate > dateFrom) opportunities.push(x);
      })
      .error((err) => console.log(err))
      .done(() => resolve(opportunities));
  });
}

async function findAllOpportunities() {
  const allOpportunities = [];
  const totalPages = await totalNumberOfPages();
  for (let i = totalPages; i > 0; i--) {
    const opportunities = await findOpportunitiesOnPage(
      base_url + "?page=" + i,
      -1
    );
    opportunities.map((x) => allOpportunities.push(x));
  }
  return allOpportunities;
}

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
