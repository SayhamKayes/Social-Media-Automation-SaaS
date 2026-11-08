FROM n8nio/n8n:latest

USER root
# Ensure standard permissions for Hugging Face non-root user (UID 1000)
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n

USER node
ENV N8N_PORT=7860
EXPOSE 7860

CMD ["n8n", "start"]

