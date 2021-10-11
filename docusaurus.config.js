// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const config = {
  title: 'weekndCN',
  tagline: 'Personal Knowledge Comb Library',
  url: 'https://your-docs-test-site.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'weekndCN', // Usually your GitHub org/user name.
  projectName: 'docs', // Usually your repo name.

  presets: [
    [
      '@docusaurus/preset-classic',
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/weekndCN/docs/edit/main/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/weeknd/docs/edit/main/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    ({
      // web nav bar
      navbar: {
        title: 'weekndCN',
        logo: {
          alt: 'My Site Logo',
          src: 'img/logoBlack.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Doc',
          },
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            href: 'https://github.com/weekndCN/docs',
            label: 'GitHub',
            position: 'right',
          },

          // add language switch button
          {
            type: 'localeDropdown',
            position: 'left',
          },

        ],
      },

      // web footer block
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/index',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/docs',
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/docs',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/docs',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/weekndCN/docs',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with docs.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),

  // add i18n
  i18n: {
    defaultLocale: 'zh-cn',
    locales: ['en', 'zh-cn'],
    localeConfigs: {
      en: {
        label: 'English',
        direction: 'ltr',
      },
      'zh-cn': {
        label: '简体中文',
        direction: 'ltr',
      }
    },
  },

};

module.exports = config;
