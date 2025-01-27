const searchApi = require('../Apis/Search.api');
const { search } = require('../Routes/postRoutes');
const searchController = {};

searchController.getSearch = async (req, res, next) => {  
    await searchApi.search(req, res);
};

searchController.getRecentSearches = async (req, res, next) => {
    await searchApi.getRecentSearches(req, res);
}

searchController.clearRecentSearches = async (req, res, next) => {
    await searchApi.clearRecentSearches(req, res);
}

module.exports = searchController;