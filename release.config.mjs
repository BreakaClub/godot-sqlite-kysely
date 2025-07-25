/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/npm",
      {
        npmPublish: true,
        tarballDir: "release"
      }
    ],
    [
      "@semantic-release/github",
      {
        assets: "release/*.tgz"
      }
    ]
  ]
};
