FROM node:22-alpine
WORKDIR /app
COPY core.mjs server.mjs ./
RUN mkdir /data && chown node:node /data
USER node
ENV PORT=8787 REPAIR_DATA_DIR=/data
EXPOSE 8787
CMD ["node","server.mjs"]
