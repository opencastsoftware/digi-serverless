import osmosis from 'osmosis'

export default function findOpportunitiesOnPage(url, dateFrom) {
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
