# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS frontend

WORKDIR /var/www/html

COPY package.json .npmrc ./
RUN npm install --no-audit --no-fund

COPY resources ./resources
COPY public ./public
COPY vite.config.js ./
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST=localhost
ARG VITE_REVERB_PORT=8080
ARG VITE_REVERB_SCHEME=http

ENV VITE_REVERB_APP_KEY=${VITE_REVERB_APP_KEY}
ENV VITE_REVERB_HOST=${VITE_REVERB_HOST}
ENV VITE_REVERB_PORT=${VITE_REVERB_PORT}
ENV VITE_REVERB_SCHEME=${VITE_REVERB_SCHEME}
RUN npm run build

FROM composer:2 AS dependencies

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts \
    --ignore-platform-req=ext-amqp

FROM php:8.3-fpm-bookworm AS application

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    librabbitmq-dev\
        libssh-dev\
        libicu-dev \
        libonig-dev \
        libsqlite3-dev \
        libzip-dev \
        librabbitmq-dev \
        unzip \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        intl \
        mbstring \
        opcache \
        pdo_mysql \
        pcntl \
        pdo_sqlite \
        zip \
    && rm -rf /var/lib/apt/lists/*
    
RUN pecl install redis \
    && pecl install amqp \
    && docker-php-ext-enable redis amqp
WORKDIR /var/www/html
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

COPY --from=dependencies /var/www/html/vendor ./vendor

RUN test -f vendor/autoload.php

COPY --from=frontend /var/www/html/public/build ./public/build

COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint

RUN chmod +x /usr/local/bin/entrypoint \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]
