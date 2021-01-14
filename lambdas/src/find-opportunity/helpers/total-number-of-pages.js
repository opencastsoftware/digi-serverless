import osmosis from 'osmosis';

const base_url =
  "https://www.digitalmarketplace.service.gov.uk/digital-outcomes-and-specialists/opportunities";


export default async function totalNumberOfPages(){
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
