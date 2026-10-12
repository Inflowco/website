# Inflow public website and compressedair.ai platform

Public site for www.inflowco.com with the compressedair.ai platform preview, plus the
Compressed Air Management System app (login, dashboard, CRM) that needs the Node server
and PostgreSQL and is not part of the static deploy.

## Static site (GitHub Pages)

Every push to `main` runs `.github/workflows/pages.yml`, which builds the public pages
with `VITE_PUBLIC_ONLY=1` (no `/app` or `/auth` routes) and deploys `dist/` to GitHub Pages.

* Preview address: https://inflowco.github.io/website/
* Custom domain: add `public/CNAME` containing `inflowco.com`, push, then set the domain in
  the repo Settings, Pages. The workflow switches the base path to `/` by itself.
* Contact form: set a repository variable `FORMSPREE_ID` (Settings, Secrets and variables,
  Actions, Variables) to the Formspree form id. Without it the form opens the visitor's
  email client addressed to peter.vinck@inflowco.com.

Build it locally the same way:

```
VITE_PUBLIC_ONLY=1 pnpm vite build && cp dist/index.html dist/404.html
npx serve dist
```

Images, PDFs and the favicon live in `public/`. Source files in Dropbox:
`INFLOW WORK SPACE\Website and Logo` (logo), `INFLOW WORK SPACE\Marketing` (sell sheets,
award badge) and `AI-Compressed Air\01 - IDEAS LIST and CONCEPT ART` (forest illustrations).

Never commit `env.json` or `data/` (customer database). Both are in `.gitignore`.

---

# Compressed Air Engineering Services Platform
        
Website to replace www.inflowco.com
I want it to provide engineering services for compressed air
services are as follows
* leak detection - ultrasonic
* data monitoring/collection - flow, power, pressure
* data reporting
* system design
* supply side audit
* demand side audit
* project or component energy savings and rebate qualification
* Base-lining or Bench-marking
Links to solutions and case studies
Customer Testimonials
Photos of history (20 years in the industry)
www.compressedairai.com link, this site is an arm of the inflow services that will do real-time compressed air data monitoring 
This will allow the customer vast insights into the system 
www.inflowco.com owns www.compressedairai.com and www.compressedair.ai 
It is a self install kit built for any type of setup and is user self installed with remote assistance to create the PID drawing for part of the dashboard, this software will allow for block diagrams to be created with 

I want the website to be blue and green with nature themes and industrial as well with mother earth in mind 
We are independent of any affiliation 
vendor neutral 
Highly experienced for keeping track of your compressed air system for maximum uptime, reliability and performance

Made with Floot.

# Instructions

For security reasons, the `env.json` file is not pre-populated — you will need to generate or retrieve the values yourself.  

For **JWT secrets**, generate a value with:  

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then paste the generated value into the appropriate field.  

For the **Floot Database**, download your database content as a pg_dump from the cog icon in the database view (right pane -> data -> floot data base -> cog icon on the left of the name), upload it to your own PostgreSQL database, and then fill in the connection string value.  

**Note:** Floot OAuth will not work in self-hosted environments.  

For other external services, retrieve your API keys and fill in the corresponding values.  

Once everything is configured, you can build and start the service with:  

```
npm install -g pnpm
pnpm install
pnpm vite build
pnpm tsx server.ts
```
