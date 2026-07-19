FROM caddy:2-alpine

RUN apk add --no-cache gettext

WORKDIR /srv

COPY index.html workshop*.html workshops.html what-we-automate.html workshop-one-pager.html workflow-assessment.html ./
COPY workshop-one-pager.pdf ./
COPY css/ css/
COPY js/ js/
COPY partials/ partials/
COPY images/ images/
COPY docker/site-Caddyfile /etc/caddy/Caddyfile
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
