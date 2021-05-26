import products from '../testdata/products';
import {JQ} from '../utils';

// returns list of available tickets based on the skus per platform
export const getAvailableTickets = async (site) => {
  console.log('Site Tickets: ' + JQ(site.info.tickets));
  return products;
};

export default {getAvailableTickets};
