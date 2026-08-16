FROM caddy:2-alpine

RUN apk add --no-cache gettext

WORKDIR /srv

COPY *.html ./
COPY workshop-one-pager.pdf ./
COPY robots.txt ./
COPY sitemap.xml ./
COPY css/ css/
COPY js/ js/
COPY partials/ partials/
COPY images/ images/
COPY demos/ demos/
COPY docker/site-Caddyfile /etc/caddy/Caddyfile
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
