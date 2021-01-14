import findOpportunitiesOnPage from './find-opportunities-on-page';
import totalNumberOfPages from './total-number-of-pages';

const base_url =
  "https://www.digitalmarketplace.service.gov.uk/digital-outcomes-and-specialists/opportunities";


export default async function findAllOpportunities() {
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
