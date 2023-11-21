import * as webchat from '@defra/flood-webchat'

const availabilityElement = document.getElementById('wc-availability')

if (availabilityElement) {
  webchat.init(availabilityElement, {
    availabilityEndpoint: '/api/webchat/availability',
    brandId: availabilityElement.dataset.brandId,
    channelId: availabilityElement.dataset.channelId,
    environment: availabilityElement.dataset.environment
  })
}
