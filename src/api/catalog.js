import request from 'request';
import ProcessorFactory from '../processor/factory';

export default ({config, db}) => function (req, res, body) {

  if (!(req.method == 'GET' || req.method == 'POST' )) {
    res.status(404).send({ 'Method is not supported.' });
  }

  const urlSegments = req.url.split('/');

  if (urlSegments.length = 2)
    indexName = urlSegments[1];

  if (urlSegments.length > 2)
    entityType = urlSegments[2]

  if ((config.elasticsearch.indices.indexOf(indexName) < 0) && (config.elasticsearch.indices.indexOf(entityType) < 0)) {
    throw new Error('Invalid / inaccessible index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/<entity_type>/_search')
  }

  if (urlSegments[urlSegments.length - 1].indexOf('_search') !== 0) {
    throw new Error('Please do use following URL format: /api/catalog/<index_name>/<entity_type>/_search')
  }

  let indexName = ''
  let entityType = ''

  // pass the request to elasticsearch
  let url = 'http://' + config.elasticsearch.host + ':' + config.elasticsearch.port + req.url;

  request({ // do the elasticsearch request
      uri: url,
      method: req.method,
      body: req.body,
      json: true},
    function (_err, _res, _resBody) {
      if (_resBody && _resBody.hits && _resBody.hits.hits) { // we're signing up all objects returned to the client to be able to validate them when (for example order)

        const factory = new ProcessorFactory(config)
        let resultProcessor = factory.getAdapter(entityType, indexName)

        if (!resultProcessor)
          resultProcessor = factory.getAdapter('default', indexName) // get the default processor

        resultProcessor.process(_resBody.hits.hits).then((result) => {
          _resBody.hits.hits = result
          res.json(_resBody);
        }).catch((err) => {
          console.error(err)
        })
      }

    } else {
    res.json(_resBody);
  }
});
}
