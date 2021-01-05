const oppFinder = require("../find-opportunity");
const nock = require("nock");
const fs = require("fs");
const { join } = require("path");
const { data } = require("osmosis");
const AWS = require("aws-sdk");

describe("Find latest opportunites", () => {
  const dateFrom = 1606435199000; //26 November 2020 23:59:59
  const url =
    "https://www.digitalmarketplace.service.gov.uk/digital-outcomes-and-specialists/opportunities";
  let data;
  beforeEach(async () => {
    const fixture = fs
      .readFileSync(join(__dirname, "fixtures/test.page1.html"), "utf-8")
      .toString();

    nock("https://www.digitalmarketplace.service.gov.uk")
      .get("/digital-outcomes-and-specialists/opportunities")
      .reply(200, fixture);

    data = await oppFinder.findOpportunitiesOnPage(url, dateFrom);
  });

  it("should gather the opportunities from the page", () => {
    expect(data.length).not.toEqual(0);
  });

  it("should set the title", () => {
    expect(data[0].title).toEqual(
      "UK SBS DDaT20358 UKRI Website Content Transition"
    );
  });

  it("should set the id", () => {
    expect(data[0].id).toEqual(13608);
  });

  it("should set the link", () => {
    expect(data[0].link).toEqual(
      "/digital-outcomes-and-specialists/opportunities/13608"
    );
  });

  it("should set the organisation", () => {
    expect(data[0].organisation).toEqual("UK Research and Innovation (UKRI)");
  });

  it("should set the location", () => {
    expect(data[0].location).toEqual("South West England");
  });

  it("should set the type", () => {
    expect(data[0].type).toEqual("Digital outcomes");
  });

  it("should set the published date timestamp", () => {
    expect(data[0].publishedDate).toEqual(1606694400000);
  });

  it("should set the questions deadline date", () => {
    expect(data[0].questionsDeadlineDate).toEqual(1607299200000);
  });

  it("should set the closing date", () => {
    expect(data[0].closingDate).toEqual(1607904000000);
  });

  it("should not return opportunities we've already seen", () => {
    expect(data.length).toEqual(4);
  });
});

describe("Find total pages of opportunites", () => {
  it("should return the number of pages of opportunities", async () => {
    const fixture = fs
      .readFileSync(join(__dirname, "fixtures/test.page1.html"), "utf-8")
      .toString();
    nock("https://www.digitalmarketplace.service.gov.uk")
      .get("/digital-outcomes-and-specialists/opportunities")
      .reply(200, fixture);

    const total = await oppFinder.totalNumberOfPages();
    expect(total).toEqual(4);
  });
});

describe("Find all opportunites", () => {
  it("should find all the opportunites", async () => {
    const page1 = fs
      .readFileSync(join(__dirname, "fixtures/test.page1.html"), "utf-8")
      .toString();
    const page2 = fs
      .readFileSync(join(__dirname, "fixtures/test.page2.html"), "utf-8")
      .toString();
    const page3 = fs
      .readFileSync(join(__dirname, "fixtures/test.page3.html"), "utf-8")
      .toString();
    const page4 = fs
      .readFileSync(join(__dirname, "fixtures/test.page4.html"), "utf-8")
      .toString();

    nock("https://www.digitalmarketplace.service.gov.uk")
      .get("/digital-outcomes-and-specialists/opportunities")
      .reply(200, page1);

    nock("https://www.digitalmarketplace.service.gov.uk")
      .get("/digital-outcomes-and-specialists/opportunities?page=1")
      .reply(200, page1);

    nock("https://www.digitalmarketplace.service.gov.uk")
      .get("/digital-outcomes-and-specialists/opportunities?page=2")
      .reply(200, page2);

    nock("https://www.digitalmarketplace.service.gov.uk")
      .get("/digital-outcomes-and-specialists/opportunities?page=3")
      .reply(200, page3);

    nock("https://www.digitalmarketplace.service.gov.uk")
      .get("/digital-outcomes-and-specialists/opportunities?page=4")
      .reply(200, page4);

    const data = await oppFinder.findAllOpportunities();
    expect(data.length).toEqual(117);
  });
});

describe("lamdba handler", () => {
  oppFinder.sqs.sendMessage = jest.fn();

  jest.spyOn(global.Date, "now").mockImplementation(() => 1606521599000);

  const fixture = fs
    .readFileSync(join(__dirname, "fixtures/test.page1.html"), "utf-8")
    .toString();

  beforeEach(async () => {
    nock("https://www.digitalmarketplace.service.gov.uk")
      .get("/digital-outcomes-and-specialists/opportunities")
      .reply(200, fixture);
  });

  it("should return a status of 201", async () => {
    const response = await oppFinder.handler({});
    expect(response.statusCode).toEqual(201);
  });

  it("should send new opportunities to the queue", async () => {
    const response = await oppFinder.handler({});
    await new Promise((r) => setTimeout(r, 2000));
    //expect(oppFinder.sqs.sendMessage.mock.calls.length).toEqual(8);
    expect(oppFinder.sqs.sendMessage.mock.calls.length).toEqual(26);
  });
});

describe("convert data to SQS message", () => {
  const data = {
    title:
      "Android App to run an offline library against substances, local and in real time",
    link: "/digital-outcomes-and-specialists/opportunities/13525",
    organisation: "Defence Science Technology Laboratory",
    location: "Off-site",
    type: "Digital outcomes",
    publishedDate: 1605744000000,
    questionsDeadlineDate: 1606348800000,
    closingDate: 1606953600000,
    id: 13525,
  };

  const message = oppFinder.convertDataToMessage(data);

  it("should set the title", () => {
    expect(message.MessageAttributes.Title.DataType).toEqual("String");
    expect(message.MessageAttributes.Title.StringValue).toEqual(
      "Android App to run an offline library against substances, local and in real time"
    );
  });

  it("should set the link", () => {
    expect(message.MessageAttributes.Link.DataType).toEqual("String");
    expect(message.MessageAttributes.Link.StringValue).toEqual(
      "/digital-outcomes-and-specialists/opportunities/13525"
    );
  });

  it("should set the organisation", () => {
    expect(message.MessageAttributes.Organisation.DataType).toEqual("String");
    expect(message.MessageAttributes.Organisation.StringValue).toEqual(
      "Defence Science Technology Laboratory"
    );
  });

  it("should set the location", () => {
    expect(message.MessageAttributes.Location.DataType).toEqual("String");
    expect(message.MessageAttributes.Location.StringValue).toEqual("Off-site");
  });

  it("should set the type", () => {
    expect(message.MessageAttributes.Type.DataType).toEqual("String");
    expect(message.MessageAttributes.Type.StringValue).toEqual(
      "Digital outcomes"
    );
  });

  it("should set the ID", () => {
    expect(message.MessageAttributes.ID.DataType).toEqual("Number");
    expect(message.MessageAttributes.ID.StringValue).toEqual("13525");
  });

  it("should set the published date", () => {
    expect(message.MessageAttributes.PublishedDate.DataType).toEqual("Number");
    expect(message.MessageAttributes.PublishedDate.StringValue).toEqual(
      "1605744000000"
    );
  });

  it("should set the questions deadline date", () => {
    expect(message.MessageAttributes.QuestionsDeadlineDate.DataType).toEqual(
      "Number"
    );
    expect(message.MessageAttributes.QuestionsDeadlineDate.StringValue).toEqual(
      "1606348800000"
    );
  });

  it("should set the closing date", () => {
    expect(message.MessageAttributes.ClosingDate.DataType).toEqual("Number");
    expect(message.MessageAttributes.ClosingDate.StringValue).toEqual(
      "1606953600000"
    );
  });

  it("should set the delay seconds", () => {
    expect(message.DelaySeconds).toEqual(10);
  });

  it("should set the queue url from the environment variable", () => {
    expect(message.QueueUrl).toEqual("//sqsqueue/TestQueue");
  });

  it("should set the message body", () => {
    expect(message.MessageBody).toEqual(
      "Android App to run an offline library against substances, local and in real time"
    );
  });
});
