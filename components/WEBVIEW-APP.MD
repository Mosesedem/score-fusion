THE FOLLOWING PAGES ARE UNIQUE ON THE MOBILE APP AND SHOULD BE EDITED ANYTIME AND UPDATE IS MADE.

1. The landing page that is /app/page.tsx
   the correct one remains in the components/add-home.tsx file.
   this is done for the following reasons:
1. the landing page on mobile app should only redirect and open the login screen
1. the landing page on web app should not show the landing page

1. the dashboard page
   the reason for this is because of the prompt to download the mobile app on the web app dashboard page.

We should also edit the pricing and payment checkout pages on the mobile app to remove any references to payment since all payments are done on the web app.

We shall create a new component that opens a contact admin dialog for all VIP or payment related issues.
