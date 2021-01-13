import findOpportunitiesOnPage from './find-opportunities-on-page';

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
