const { generateCareerPredictions } = require("./careerPrediction.js");
const { computeJobMatches } = require("./jobMatching.js");
const {
  generateCurriculumImpact,
  getAvailablePrograms,
  getOverallStats,
} = require("./curriculumImpact.js");

module.exports = {
  generateCareerPredictions,
  computeJobMatches,
  generateCurriculumImpact,
  getAvailablePrograms,
  getOverallStats,
};
