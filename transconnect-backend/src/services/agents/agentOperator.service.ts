/**
 * Agent Operator Management Service
 * Handles registration and management of operators by agents
 */

import { prisma } from '../../index';
import bcrypt from 'bcryptjs';

export class AgentOperatorService {
  
  /**
   * Register a new operator under an agent's management
   */
  static async registerOperator(agentId: string, operatorData: {
    companyName: string;
    license: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password?: string;
  }) {
    try {
      // Validate agent exists and is approved
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { id: true, status: true }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      if (agent.status === 'SUSPENDED' || agent.status === 'INACTIVE') {
        throw new Error('Agent account is suspended or inactive');
      }

      if (agent.status === 'PENDING') {
        throw new Error('Agent account is pending verification');
      }

      // Check if email or phone already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: operatorData.email },
            { phone: operatorData.phone }
          ]
        }
      });

      if (existingUser) {
        throw new Error('A user with this email or phone number already exists');
      }

      // Check if license already exists
      const existingOperator = await prisma.operator.findUnique({
        where: { license: operatorData.license }
      });

      if (existingOperator) {
        throw new Error('An operator with this license already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(operatorData.password || 'defaultpass123', 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          firstName: operatorData.firstName,
          lastName: operatorData.lastName,
          email: operatorData.email,
          phone: operatorData.phone,
          password: hashedPassword,
          role: 'OPERATOR',
          verified: true
        }
      });

      // Create operator linked to agent
      const operator = await prisma.operator.create({
        data: {
          companyName: operatorData.companyName,
          license: operatorData.license,
          userId: user.id,
          agentId: agentId,
          managedByAgent: true,
          approved: false // Requires admin approval
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          managingAgent: {
            select: {
              id: true,
              name: true,
              referralCode: true
            }
          }
        }
      });

      // Create agent-operator relationship
      await prisma.agentOperator.create({
        data: {
          agentId: agentId,
          operatorId: operator.id,
          role: 'MANAGER',
          permissions: ['manage_routes', 'manage_buses', 'view_analytics']
        }
      });

      return {
        success: true,
        operator,
        message: 'Operator registered successfully. Pending admin approval.'
      };

    } catch (error: any) {
      throw new Error(`Failed to register operator: ${error.message}`);
    }
  }

  /**
   * Get all operators managed by an agent
   */
  static async getAgentOperators(agentId: string) {
    try {
      const operators = await prisma.operator.findMany({
        where: { agentId: agentId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          buses: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
              capacity: true,
              active: true
            }
          },
          routes: {
            select: {
              id: true,
              origin: true,
              destination: true,
              price: true,
              active: true,
              departureTime: true
            }
          },
          agentOperatorRel: {
            where: { agentId: agentId },
            select: {
              role: true,
              permissions: true,
              isActive: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculate some basic stats for each operator
      const operatorsWithStats = await Promise.all(
        operators.map(async (operator) => {
          // Get booking count (last 30 days)
          const bookingCount = await prisma.booking.count({
            where: {
              route: { operatorId: operator.id },
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          });

          // Get total revenue (last 30 days)
          const revenue = await prisma.booking.aggregate({
            where: {
              route: { operatorId: operator.id },
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              },
              status: 'CONFIRMED'
            },
            _sum: {
              totalAmount: true
            }
          });

          return {
            ...operator,
            stats: {
              totalRoutes: operator.routes.length,
              totalBuses: operator.buses.length,
              bookingsLast30Days: bookingCount,
              revenueLast30Days: revenue._sum.totalAmount || 0
            }
          };
        })
      );

      return operatorsWithStats;

    } catch (error: any) {
      throw new Error(`Failed to get agent operators: ${error.message}`);
    }
  }

  /**
   * Get detailed operator information
   */
  static async getOperatorDetails(agentId: string, operatorId: string) {
    try {
      // Verify agent manages this operator
      const agentOperator = await prisma.agentOperator.findFirst({
        where: {
          agentId: agentId,
          operatorId: operatorId,
          isActive: true
        }
      });

      if (!agentOperator) {
        throw new Error('Operator not found or not managed by this agent');
      }

      const operator = await prisma.operator.findUnique({
        where: { id: operatorId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              createdAt: true
            }
          },
          buses: {
            include: {
              routes: {
                select: {
                  id: true,
                  origin: true,
                  destination: true,
                  departureTime: true
                }
              }
            }
          },
          routes: {
            include: {
              bus: {
                select: {
                  plateNumber: true,
                  model: true
                }
              },
              stops: {
                orderBy: { order: 'asc' }
              },
              _count: {
                select: {
                  bookings: true
                }
              }
            }
          },
          managingAgent: {
            select: {
              id: true,
              name: true,
              referralCode: true
            }
          }
        }
      });

      if (!operator) {
        throw new Error('Operator not found');
      }

      // Get performance analytics
      const analytics = await this.getOperatorAnalytics(operatorId);

      return {
        ...operator,
        analytics,
        agentRole: agentOperator.role,
        permissions: agentOperator.permissions
      };

    } catch (error: any) {
      throw new Error(`Failed to get operator details: ${error.message}`);
    }
  }

  /**
   * Update operator information
   */
  static async updateOperator(agentId: string, operatorId: string, updateData: {
    companyName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }) {
    try {
      // Verify agent can manage this operator
      const agentOperator = await prisma.agentOperator.findFirst({
        where: {
          agentId: agentId,
          operatorId: operatorId,
          isActive: true
        }
      });

      if (!agentOperator) {
        throw new Error('Operator not found or not managed by this agent');
      }

      const operator = await prisma.operator.findUnique({
        where: { id: operatorId },
        include: { user: true }
      });

      if (!operator) {
        throw new Error('Operator not found');
      }

      // Check for conflicts if email/phone is being updated
      if (updateData.email || updateData.phone) {
        const conflictingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: operator.userId } },
              {
                OR: [
                  ...(updateData.email ? [{ email: updateData.email }] : []),
                  ...(updateData.phone ? [{ phone: updateData.phone }] : [])
                ]
              }
            ]
          }
        });

        if (conflictingUser) {
          throw new Error('A user with this email or phone number already exists');
        }
      }

      // Update user information
      if (updateData.firstName || updateData.lastName || updateData.email || updateData.phone) {
        await prisma.user.update({
          where: { id: operator.userId },
          data: {
            ...(updateData.firstName && { firstName: updateData.firstName }),
            ...(updateData.lastName && { lastName: updateData.lastName }),
            ...(updateData.email && { email: updateData.email }),
            ...(updateData.phone && { phone: updateData.phone })
          }
        });
      }

      // Update operator information
      const updatedOperator = await prisma.operator.update({
        where: { id: operatorId },
        data: {
          ...(updateData.companyName && { companyName: updateData.companyName })
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          managingAgent: {
            select: {
              id: true,
              name: true,
              referralCode: true
            }
          }
        }
      });

      return {
        success: true,
        operator: updatedOperator,
        message: 'Operator updated successfully'
      };

    } catch (error: any) {
      throw new Error(`Failed to update operator: ${error.message}`);
    }
  }

  /**
   * Get operator analytics
   */
  static async getOperatorAnalytics(operatorId: string) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Total bookings and revenue
      const [totalBookings, totalRevenue, monthlyBookings, monthlyRevenue, weeklyBookings, weeklyRevenue] = await Promise.all([
        prisma.booking.count({
          where: { route: { operatorId } }
        }),
        prisma.booking.aggregate({
          where: { 
            route: { operatorId },
            status: 'CONFIRMED'
          },
          _sum: { totalAmount: true }
        }),
        prisma.booking.count({
          where: { 
            route: { operatorId },
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        prisma.booking.aggregate({
          where: { 
            route: { operatorId },
            status: 'CONFIRMED',
            createdAt: { gte: thirtyDaysAgo }
          },
          _sum: { totalAmount: true }
        }),
        prisma.booking.count({
          where: { 
            route: { operatorId },
            createdAt: { gte: sevenDaysAgo }
          }
        }),
        prisma.booking.aggregate({
          where: { 
            route: { operatorId },
            status: 'CONFIRMED',
            createdAt: { gte: sevenDaysAgo }
          },
          _sum: { totalAmount: true }
        })
      ]);

      // Route performance
      const routePerformance = await prisma.route.findMany({
        where: { operatorId },
        select: {
          id: true,
          origin: true,
          destination: true,
          price: true,
          _count: {
            select: {
              bookings: true
            }
          }
        },
        orderBy: {
          bookings: {
            _count: 'desc'
          }
        },
        take: 5
      });

      return {
        totalBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        monthlyBookings,
        monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
        weeklyBookings,
        weeklyRevenue: weeklyRevenue._sum.totalAmount || 0,
        topRoutes: routePerformance
      };

    } catch (error: any) {
      throw new Error(`Failed to get operator analytics: ${error.message}`);
    }
  }

  /**
   * Get agent's operator management dashboard data
   */
  static async getAgentOperatorDashboard(agentId: string) {
    try {
      const operators = await this.getAgentOperators(agentId);
      
      // Calculate aggregate statistics
      const totalOperators = operators.length;
      const activeOperators = operators.filter(op => op.approved).length;
      const pendingOperators = operators.filter(op => !op.approved).length;
      
      const totalRevenue = operators.reduce((sum, op) => sum + op.stats.revenueLast30Days, 0);
      const totalBookings = operators.reduce((sum, op) => sum + op.stats.bookingsLast30Days, 0);
      const totalRoutes = operators.reduce((sum, op) => sum + op.stats.totalRoutes, 0);
      const totalBuses = operators.reduce((sum, op) => sum + op.stats.totalBuses, 0);

      // Top performing operators
      const topOperators = [...operators]
        .sort((a, b) => b.stats.revenueLast30Days - a.stats.revenueLast30Days)
        .slice(0, 5)
        .map(op => ({
          id: op.id,
          companyName: op.companyName,
          revenue: op.stats.revenueLast30Days,
          bookings: op.stats.bookingsLast30Days
        }));

      return {
        summary: {
          totalOperators,
          activeOperators,
          pendingOperators,
          totalRevenue,
          totalBookings,
          totalRoutes,
          totalBuses
        },
        topOperators,
        recentOperators: operators.slice(0, 5).map(op => ({
          id: op.id,
          companyName: op.companyName,
          approved: op.approved,
          createdAt: op.createdAt,
          stats: op.stats
        }))
      };

    } catch (error: any) {
      throw new Error(`Failed to get agent operator dashboard: ${error.message}`);
    }
  }
}