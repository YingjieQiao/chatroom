const axios = require('axios');

const getCountryCode = async function (ip) {
    const res = await axios.get(`http://www.geoplugin.net/json.gp?ip=${ip}`);

    if (!!res.data.geoplugin_countryCode) {
        return res.data.geoplugin_countryCode;
    }

    return null;
};

const containsProfanity = async function (str) {
    const res = await axios.get(`https://www.purgomalum.com/service/containsprofanity?text=${str}`);

    if (res.data) {
        return true;
    }

    return false;
};

module.exports = {
    getCountryCode,
    containsProfanity,
};
