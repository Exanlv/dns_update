require('@exan/envreader').load();

const fetch = require('node-fetch');

const godaddy_auth_header = `sso-key ${process.env.GODADDY_KEY}:${process.env.GODADDY_SECRET}`;
const godaddy_base_url = 'https://api.godaddy.com/';
const names = process.env.NAMES.split(',');

(async () => {
	const own_ip = await (await fetch('http://ipecho.net/plain')).text();

	names.forEach(async (name) => {
		const data = await (
			await fetch(
				`${godaddy_base_url}v1/domains/${process.env.DOMAIN}/records/A/${name}`,
				{
					method: 'get',
					headers: {
						'Authorization': godaddy_auth_header,
						'Content-Type': 'application/json'
					}
				}
			)
		).json();

		if (!data.length)
			throw `DNS record with name '${name}' does not exist`;
		
		if (data[0].data === own_ip) {
			console.log(`DNS record for ${name} is OK`);
			return;
		}

		const res = await fetch(
			`${godaddy_base_url}v1/domains/${process.env.DOMAIN}/records/A/${name}`,
			{
				method: 'put',
				headers: {
					'Authorization': godaddy_auth_header,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify([
					{
						data: own_ip
					}
				])
			}
		);

		if (!res.ok) {
			console.log(await res.json());

			throw `Failed updating DNS record for '${name}'`;
		}

		console.log(`Updated DNS record for ${name}`);
	});
})();
