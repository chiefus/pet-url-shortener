FROM python:3.9-alpine
ENV PYTHONUNBUFFERED=1
ENV PIP_ROOT_USER_ACTION=ignore
ENV WORKDIR=/url_shortener
WORKDIR $WORKDIR

RUN adduser -D django
COPY --chown=django ./ ${WORKDIR}
RUN pip install --upgrade pip 
RUN pip install -r requirements.txt
USER django

ENTRYPOINT ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "url_shortener.wsgi:application", "--access-logfile=-"]
