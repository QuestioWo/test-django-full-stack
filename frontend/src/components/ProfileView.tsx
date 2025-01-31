import React from 'react';

import { FaCheck, FaTimes, FaSpinner, FaList, FaTrash, FaPlus } from 'react-icons/fa';
import { Result } from 'neverthrow';
import { Button, Card, Col, Form, InputGroup, Offcanvas, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import config from '../config';
import { UserRESTSubmit, UserREST, UserRESTKeys, UserStripeUpdateLinkREST, UserStripeOnboardingLinkREST, Tokens, PageProps, resolveGETCall, resolvePUTCall, userStripeOnboardingLinkRESTLink, userRESTLink, userStripeUpdateLinkRESTLink, userRESTSubmitLink, OrderListREST, orderListRESTLink, getFormattedPriceString, OrderBuyerRESTSubmit, OrderREST, orderRESTSubmitLink, OrderSellerRESTSubmit, resolvePOSTCall, mediaURL, profilePictureURL, resolveDELETECall, itemsListRESTLink, ItemRESTList } from '../utils';

import BasePage from './elements/BasePage';

import './ProfileView.css';
import { LinkContainer } from 'react-router-bootstrap';

interface MatchParams {
	username: string
}

export interface ProfileViewProps extends RouteComponentProps<MatchParams>, PageProps { }

interface State {
	user: UserREST,
	form: UserRESTSubmit,
	isUser: boolean,
	submit_error: boolean,
	onboarding_link: string
	update_link: string,
	orders: OrderListREST,
	ordersForm: OrderListREST,
	showOrders: boolean,
	items: ItemRESTList
}

export class ProfileView extends React.Component<ProfileViewProps, State> {
	constructor(props: ProfileViewProps) {
		super(props);

		this.state = {
			user: {
				first_name: "",
				last_name: "",
				email: "",
				location_town: "",
				location_country: "",
				location_postcode: "",
				bio: "",
				verified: false,
				is_seller: false,
				profile_picture: false
			},
			form: {
				first_name: "",
				last_name: "",
				email: "",
				location_town: "",
				location_country: "",
				location_postcode: "",
				bio: ""
			},
			submit_error: false,
			isUser: localStorage.getItem("username") === this.props.match.params.username,
			onboarding_link: "",
			update_link: "",
			orders: [],
			ordersForm: [],
			showOrders: false,
			items: []
		};
	}

	async componentDidMount() {
		const pathItems: string = itemsListRESTLink + this.props.match.params.username + '/';
		const resultItem: Result<ItemRESTList, Error> = await resolveGETCall<ItemRESTList>(pathItems);

		resultItem
			.map(res => {
				this.setState({ items: res });

				return null; // necessary to silence warning
			})
			.mapErr(err => {
				this.props.updateAlertBar("Cannot recieve items", "warning", true);
				console.error(err);
			});

		const path: string = userRESTLink + this.props.match.params.username + '/';
		const result: Result<UserREST, Error> = await resolveGETCall<UserREST>(path);

		result
			.map(res => {
				this.setState({ user: Object.assign({}, res), form: Object.assign({}, res) });

				return null; // necessary to silence warning
			})
			.mapErr(err => {
				console.error(err);
				this.props.updateAlertBar("User does not exist. Do you want this account?", "warning", true);
				this.props.history.push('/login');
			});

		if (this.state.isUser) {
			// get the users orders
			const pathOrders: string = orderListRESTLink + this.props.match.params.username + '/';
			const resultOrders: Result<OrderListREST, Error> = await resolveGETCall<OrderListREST>(pathOrders, true);

			resultOrders
				.map(res => {
					this.setState({ orders: res, ordersForm: [...res] });

					return null; // necessary to silence warning
				})
				.mapErr(err => {
					// cannot be authenticated with the user therefore, jwt tokens must not be correct, therefore, deny form access
					this.setState({ isUser: false });

					console.error(err);
				});

			// get the update or onboarding stripe link, depending on if the user is verified or not
			if (!this.state.user.verified) {
				const pathStripeOnboardingLink: string = userStripeOnboardingLinkRESTLink + this.props.match.params.username + '/';
				const resultStripeOnboardingLink: Result<UserStripeOnboardingLinkREST, Error> = await resolveGETCall<UserStripeOnboardingLinkREST>(pathStripeOnboardingLink, true);

				resultStripeOnboardingLink
					.map(res => {
						this.setState({ onboarding_link: res.onboarding_link });

						return null; // necessary to silence warning
					})
					.mapErr(err => {
						// cannot be authenticated with the user therefore, jwt tokens must not be correct, therefore, deny form access
						this.setState({ isUser: false });

						console.error(err);
					});
			} else {
				const pathStripeUpdateLink: string = userStripeUpdateLinkRESTLink + this.props.match.params.username + '/';
				const resultStripeUpdateLink: Result<UserStripeUpdateLinkREST, Error> = await resolveGETCall<UserStripeUpdateLinkREST>(pathStripeUpdateLink, true);

				resultStripeUpdateLink
					.map(res => {
						this.setState({ update_link: res.update_link });

						return null; // necessary to silence warning
					})
					.mapErr(err => {
						// cannot be authenticated with the user therefore, jwt tokens must not be correct, therefore, deny form access
						this.setState({ isUser: false });

						console.error(err);
					});
			}
		} else if (localStorage.getItem("username") !== null && localStorage.getItem("username") !== "") {
			// if the user is logged in, but the profile page isn't theirs, get the orders that they have with the current profile
			const pathOrders: string = orderListRESTLink + this.props.match.params.username + '/' + localStorage.getItem("username") + '/';
			const resultOrders: Result<OrderListREST, Error> = await resolveGETCall<OrderListREST>(pathOrders, true);

			resultOrders
				.map(res => {
					this.setState({ orders: res, ordersForm: [...res] });

					return null; // necessary to silence warning
				})
				.mapErr(err => {
					console.error(err);
				});
		}

		// NOTE: comment everything below this out
		/*
		const itemsPath: string = itemsListRESTLink + this.props.match.params.username + '/';
		const itemResult: Result<ItemRESTList, Error> = await resolveGETCall<ItemRESTList>(itemsPath);

		itemResult
			.map(res => {
				for (var i: number = 0; i < res.length; ++i) {
					const index: number = i;
					const itemTypePath: string = itemTypeListRESTLink + this.props.match.params.username + '/' + res[i].name + '/';
					resolveGETCall<ItemTypeRESTList>(itemTypePath)
						.then(itemTypeResult => {
							this.props.emptyBasket(); // only adds itemtypes of one item

							itemTypeResult
								.map(resType => {
									for (var i: number = 0; i < resType.length; ++i) {
										this.props.addToBasket(res[index], resType[i]);
									}
									return null;
								})
								.mapErr(err => {
									console.error(err);
								})
						});
				}

				return null; // necessary to silence warning
			})
			.mapErr(err => {
				console.error(err);
			});
		*/
	}

	handleDeleteAccount = async () => {
		const pathOrders: string = userRESTSubmitLink + this.props.match.params.username + '/';
		const resultOrders: Result<UserREST, Error> = await resolveDELETECall<UserREST>(pathOrders, true);

		resultOrders
			.map(res => {
				localStorage.setItem("username", "");

				const tokens: Tokens = {
					"access": "",
					"refresh": ""
				};
				localStorage.setItem("tokens", JSON.stringify(tokens));

				this.props.history.push('/login');

				this.props.updateAlertBar("Deleted user successfully", "success", true);

				return null; // necessary to silence warning
			})
			.mapErr(err => {
				this.props.updateAlertBar("Could not delete user, please try re-logging in", "danger", true);

				console.error(err);
			});
	}

	toggleOrders = async () => {
		this.setState(prevState => (
			{ showOrders: !prevState.showOrders }
		));
	}

	handleChangeSubmit = async () => {
		const path = userRESTSubmitLink + this.props.match.params.username + '/';

		const result: Result<UserREST, Error> = await resolvePUTCall<UserREST, UserRESTSubmit>(path, this.state.form, true);

		result
			.map(res => {
				this.setState({ user: Object.assign({}, res) });

				return null; // necessary to silence warning
			})
			.mapErr(err => {
				const message: string = "Could not complete request, please try logging out and back in";

				this.setState({ submit_error: true });

				this.props.updateAlertBar(message, "danger", true);
			});
	}

	handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		this.handleChangeSubmit();
	}

	handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const id: string = event.target.id;
		var index: UserRESTKeys;
		if (id === "email") {
			index = "email";
		} else if (id === "first_name") {
			index = "first_name";
		} else if (id === "last_name") {
			index = "last_name";
		} else if (id === "location_town") {
			index = "location_town";
		} else if (id === "location_country") {
			index = "location_country";
		} else if (id === "location_postcode") {
			index = "location_postcode";
		} else { // id === bio
			index = "bio";
		}

		const cp: UserRESTSubmit = this.state.form;
		cp[index] = event.target.value;
		this.setState({ form: cp });
		this.handleChangeSubmit();
	}

	handleLogOut = async () => {
		localStorage.setItem("username", "");

		const tokens: Tokens = {
			"access": "",
			"refresh": ""
		};
		localStorage.setItem("tokens", JSON.stringify(tokens));

		localStorage.setItem("basket", JSON.stringify([]));

		this.props.history.go(0);
	}

	getFormVariant = (field: UserRESTKeys): string => {
		if (this.state.form[field] === this.state.user[field]) {
			return "outline-success";
		} else {
			if (this.state.submit_error) {
				return "outline-danger";
			} else {
				return "outline-warning";
			}
		}
	}

	getFormIcon = (field: UserRESTKeys): JSX.Element => {
		if (this.state.form[field] === this.state.user[field]) {
			return <FaCheck />;
		} else {
			if (this.state.submit_error) {
				return <FaTimes />;
			} else {
				return <FaSpinner className="spinner" />;
			}
		}
	}

	handleOrderSubmit = async (index: number, event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const path = orderRESTSubmitLink + this.state.orders[index].id + '/';

		if (this.state.orders[index].seller === localStorage["username"]) {
			const data: OrderSellerRESTSubmit = {
				shipping_tag: this.state.ordersForm[index].shipping_tag,
				shipped: this.state.ordersForm[index].shipped
			};
			const result: Result<OrderREST, Error> = await resolvePOSTCall<OrderREST, OrderSellerRESTSubmit>(path, data, true);

			result
				.map(res => {
					let copy: OrderListREST = [...this.state.orders];
					copy[index] = res;
					this.setState({ orders: copy });

					return null; // necessary to silence warning
				})
				.mapErr(err => {
					const message: string = "Could not update order, please try logging out and back in";

					this.setState({ submit_error: true });

					this.props.updateAlertBar(message, "danger", true);
				});
		} else {
			const data: OrderBuyerRESTSubmit = {
				arrived: this.state.ordersForm[index].arrived
			};
			const result: Result<OrderREST, Error> = await resolvePOSTCall<OrderREST, OrderBuyerRESTSubmit>(path, data, true);

			result
				.map(res => {
					let copy: OrderListREST = [...this.state.orders];
					copy[index] = res;
					this.setState({ orders: copy });

					return null; // necessary to silence warning
				})
				.mapErr(err => {
					const message: string = "Could not update order, please try logging out and back in";

					this.setState({ submit_error: true });

					this.props.updateAlertBar(message, "danger", true);
				});
		}
	}

	handleOrderCheckChange = (index: number, field: "arrived" | "shipped") => {
		this.setState(prevState => {
			var copy: OrderListREST = [...prevState.ordersForm];
			copy[index][field] = true;

			return ({ ordersForm: copy });
		});
	}

	handleOrderShippingTagChange = (index: number, event: any) => {
		this.setState(prevState => {
			var copy: OrderListREST = [...prevState.ordersForm];
			copy[index]["shipping_tag"] = event.target.value;

			return ({ ordersForm: copy });
		});
	}

	render() {
		return (
			<React.Fragment>
				<Offcanvas
					show={this.state.showOrders}
					onHide={this.toggleOrders}
					placement='end'
					scroll={true}
					backdrop={false}
					className='orders-offcanvas body'>
					<Offcanvas.Header closeButton className='orders-offcanvas header'>
						<Offcanvas.Title className="title">orders</Offcanvas.Title>
					</Offcanvas.Header>
					<Offcanvas.Body>
						{this.state.orders.map((order, index) => {
							return (
								<React.Fragment key={index + '-order-entry'}>
									<div className="orders-offcanvas order">
										<Form onSubmit={(event) => this.handleOrderSubmit(index, event)}>
											<Row>
												<Col>
													<h5 className="title">
														<Link to={'/item/' + order.item_name}>
															{order.item_name}
														</Link>
													</h5>
												</Col>
												<Col>
													<span style={{ float: 'right' }}>
														£{getFormattedPriceString(order.total)}
													</span>
												</Col>
											</Row>
											<Row>
												<Col>
													Bought from:
												</Col>
												<Col>
													<div style={{ float: 'right' }}>
														<Link to={'/profile/' + order.seller}>
															{order.seller}
														</Link>
													</div>
												</Col>
											</Row>
											<Row>
												<Col>
													Bought by:
												</Col>
												<Col>
													<div style={{ float: 'right' }}>
														<Link to={'/profile/' + order.buyer}>
															{order.buyer}
														</Link>
													</div>
												</Col>
											</Row>
											<Row>
												<Col>
													Size
												</Col>
												<Col>
													<div style={{ float: 'right' }}>
														{order.item_type_size}
													</div>
												</Col>
											</Row>
											<Row>
												<Col>
													Payment Processed
												</Col>
												<Col>
													<div style={{ float: 'right' }}>
														<Form.Check
															type='checkbox'
															defaultChecked={order.payment_successful}
															disabled />
													</div>
												</Col>
											</Row>
											<Row>
												<Col>
													Shipped
												</Col>
												<Col>
													<div style={{ float: 'right' }}>
														{(order.seller === localStorage["username"] && this.state.ordersForm[index].shipping_tag === "") ?
															<OverlayTrigger
																placement='top'
																overlay={
																	<Tooltip id={index + '-shipped-tooltip'}>
																		Cannot mark as shipped until Tracking Number is supplied
        																</Tooltip>
																}
															>
																<div>
																	<Form.Check
																		type='checkbox'
																		defaultChecked={order.shipped}
																		disabled />
																</div>
															</OverlayTrigger>
															:
															<Form.Check
																type='checkbox'
																onChange={() => this.handleOrderCheckChange(index, "shipped")}
																disabled={!(order.seller === localStorage["username"]) || order.shipped}
																defaultChecked={order.shipped} />
														}
													</div>
												</Col>
											</Row>
											<Row>
												<Col>
													Tracking Number
												</Col>
												<Col>
													{order.seller === localStorage["username"] ?
														<Form.Control
															required
															type="text"
															value={order.shipping_tag}
															onChange={(event) => this.handleOrderShippingTagChange(index, event)}
															disabled={order.shipped} />
														:
														<React.Fragment>
															<div style={{ float: 'right' }}>
																{order.shipping_tag}
															</div>
														</React.Fragment>
													}
												</Col>
											</Row>
											<Row>
												<Col>
													Arrived
												</Col>
												<Col>
													<div style={{ float: 'right' }}>
														{(order.buyer === localStorage["username"] && !order.shipped) ?
															<OverlayTrigger
																placement='top'
																overlay={
																	<Tooltip id={index + '-shipped-tooltip'}>
																		Cannot mark as arrived until shipped
        																</Tooltip>
																}
															>
																<div>
																	<Form.Check
																		type='checkbox'
																		defaultChecked={order.arrived}
																		disabled />
																</div>
															</OverlayTrigger>
															:
															<Form.Check
																type='checkbox'
																onChange={() => this.handleOrderCheckChange(index, "arrived")}
																disabled={!(order.buyer === localStorage["username"]) || order.arrived}
																defaultChecked={order.arrived} />
														}
													</div>
												</Col>
											</Row>
											<Row>
												<Col>
													<Button className="styled-btn" type='submit' variant='outline-secondary' style={{ float: 'right' }}>
														Update
													</Button>
												</Col>
											</Row>
										</Form>
									</div>
								</React.Fragment>
							);
						})}
					</Offcanvas.Body>
				</Offcanvas >

				<BasePage {...this.props}>
					<Row>
						<Col>
							<h1 className="title">
								{this.state.user.first_name} {this.state.user.last_name}'s Profile
								{this.state.user.verified && this.state.user.is_seller &&
									< FaCheck />
								}
							</h1>
						</Col>
						<Col>
							<div style={{ float: 'right' }}>
								{this.state.orders.length > 0 &&
									<Button className="styled-btn" onClick={this.toggleOrders} variant='outline-secondary'>
										<FaList /> show orders
									</Button>
								}
								{this.state.isUser &&
									<React.Fragment>
										{' '}
										<LinkContainer to={'/checkout'}>
											<Button className="styled-btn" variant='outline-success'>
												checkout basket
											</Button>
										</LinkContainer>
										{' '}
										<Button className="styled-btn" onClick={this.handleLogOut} variant='outline-danger'>
											log out
										</Button>
									</React.Fragment>
								}
							</div>
						</Col>
					</Row>

					<Row>
						<div>
							@{this.props.match.params.username}
						</div>
					</Row>

					<Row>
						<Col>
							<img className="profile-picture" alt=""
								src={config.apiURL + mediaURL + this.props.match.params.username + "/" + profilePictureURL} />
						</Col>
					</Row>

					<Row>
						{this.state.isUser ?
							<Form onSubmit={this.handleFormSubmit}>
								<Form.Label>bio</Form.Label>
								<InputGroup className="mb-3">
									<Form.Control
										required
										type="text"
										as="textarea"
										id="bio"
										value={this.state.form.bio}
										onChange={this.handleFormChange} />
									<Button variant={this.getFormVariant("bio")} disabled>
										{this.getFormIcon("bio")}
									</Button>
								</InputGroup>
							</Form>
							:
							<div>
								{this.state.user.bio}
							</div>
						}
					</Row>

					<Row>
						{this.state.isUser ?
							<Form onSubmit={this.handleFormSubmit}>
								<Form.Label>email</Form.Label>
								<InputGroup className="mb-3">
									<Form.Control
										required
										type="email"
										id="email"
										value={this.state.form.email}
										onChange={this.handleFormChange} />
									<Button variant={this.getFormVariant("email")} disabled>
										{this.getFormIcon("email")}
									</Button>
								</InputGroup>
							</Form>
							:
							<div>
								{this.state.user.email}
							</div>
						}
					</Row>

					<Row>
						<span style={{ display: "inherit" }}>
							{this.state.isUser ?
								<Form onSubmit={this.handleFormSubmit}>
									<Form.Label>town/city</Form.Label>
									<InputGroup className="mb-3">
										<Form.Control
											required
											type="text"
											id="location_town"
											value={this.state.form.location_town}
											onChange={this.handleFormChange} />
										<Button variant={this.getFormVariant("location_town")} disabled>
											{this.getFormIcon("location_town")}
										</Button>
									</InputGroup>
								</Form>
								:
								<div>
									{this.state.user.location_town},
								</div>
							}
							&nbsp;
							{this.state.isUser ?
								<Form onSubmit={this.handleFormSubmit}>
									<Form.Label>country</Form.Label>
									<InputGroup className="mb-3">
										<Form.Control
											required
											type="text"
											id="location_country"
											value={this.state.form.location_country}
											onChange={this.handleFormChange} />
										<Button variant={this.getFormVariant("location_country")} disabled>
											{this.getFormIcon("location_country")}
										</Button>
									</InputGroup>
								</Form>
								:
								<div>
									{this.state.user.location_country}
								</div>
							}
						</span>
					</Row>



					{this.state.isUser &&
						<React.Fragment>
							<Row>
								<Form onSubmit={this.handleFormSubmit}>
									<Form.Label>postcode</Form.Label>
									<InputGroup className="mb-3">
										<Form.Control
											required
											type="text"
											id="location_postcode"
											value={this.state.form.location_postcode}
											onChange={this.handleFormChange} />
										<Button variant={this.getFormVariant("location_postcode")} disabled>
											{this.getFormIcon("location_postcode")}
										</Button>
									</InputGroup>
								</Form>
							</Row>

							<Row>
								<Form onSubmit={this.handleFormSubmit}>
									<Form.Label>first name</Form.Label>
									<InputGroup className="mb-3">
										<Form.Control
											required
											type="text"
											id="first_name"
											value={this.state.form.first_name}
											onChange={this.handleFormChange} />
										<Button variant={this.getFormVariant("first_name")} disabled>
											{this.getFormIcon("first_name")}
										</Button>
									</InputGroup>
								</Form>
							</Row>
							<Row>
								<Form onSubmit={this.handleFormSubmit}>
									<Form.Label>last name</Form.Label>
									<InputGroup className="mb-3">
										<Form.Control
											required
											type="text"
											id="last_name"
											value={this.state.form.last_name}
											onChange={this.handleFormChange} />
										<Button variant={this.getFormVariant("last_name")} disabled>
											{this.getFormIcon("last_name")}
										</Button>
									</InputGroup>
								</Form>
							</Row>
							<Row>
								{(this.state.onboarding_link !== "" && !this.state.user.verified) &&
									<React.Fragment>
										<Form.Label>get verified</Form.Label>
										<InputGroup>
											<a
												target="_blank"
												rel="noreferrer"
												href={this.state.onboarding_link}
												className="stripe-connect">
												<span>Connect with</span>
											</a>
										</InputGroup>
									</React.Fragment>
								}
								{this.state.update_link !== "" &&
									<React.Fragment>
										<Form.Label>update payment information</Form.Label>
										<InputGroup>
											<a
												target="_blank"
												rel="noreferrer"
												href={this.state.update_link}
												className="stripe-connect">
												<span>update with</span>
											</a>
										</InputGroup>
									</React.Fragment>
								}
							</Row>
							<Row>
								<Col>
									delete account
							</Col>
							</Row>
							<Row>
								<Col>
									<Button className='styled-btn' onClick={this.handleDeleteAccount} variant='outline-danger'>
										<FaTrash /> delete
								</Button>
								</Col>
							</Row>
						</React.Fragment>
					}

					<Row style={{ marginTop: '2rem' }}>
						< Col >
							<h3 className="title">
								items
							</h3>
						</Col>
						{this.state.isUser &&
							<Col>
								<LinkContainer to='/new_item/' style={{ float: 'right' }} >
									<Button variant='outline-secondary'>
										<FaPlus />add an item
									</Button>
								</LinkContainer>
							</Col>
						}
					</Row>
					<Row>
						<Col xs={11}>

							<Row className="browse">
								{this.state.items.map(item => {
									return (
										<React.Fragment>
											<Card className="product">

												<Card.Img variant="top" src={config.apiURL + mediaURL + item.seller_name + "/" + item.name + "/0.png"} className='item-image' />
												<Card.Body>
													<Card.Title className="title " >{item.name} ({item.colour})</Card.Title>
													<Card.Text className="sub1">by {item.seller_name}</Card.Text>
												</Card.Body>
											</Card>
										</React.Fragment>
									)
								})

								}
							</Row>
						</Col>
					</Row>
				</BasePage>
			</React.Fragment >
		);
	}
}